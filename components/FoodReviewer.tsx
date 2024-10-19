'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
});

const Component = () => {
  const [ingredients, setIngredients] = useState('');
  const [results, setResults] = useState<{
    [key: string]: { rate: number; dose: number };
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const getIngredientHealthRating = async (
    ingredient: string
  ): Promise<{ rate: number; dose: number }> => {
    const prompt = `What is the health rating for ${ingredient}?, rate ingredients returns the 1,2,3 if 1 means goog for health, 2 means use in limit and 3 means bad for health, I just need rating number object with key overAllHealthRate and dailyLimitedDosage in milli-grams no additional data or information`;
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
     });

    const response = chatCompletion.choices[0]?.message?.content;

    if (response) {
      const splitResponse = response.split(':');

      if (splitResponse.length > 1) {
        const trimmedString = splitResponse[1]?.replace(/[^0-9]/g, '');
        const rate = Number(trimmedString);
        const dose = Number(splitResponse[2]?.replace(/[^0-9]/g, ''));
        console.log({ ingredient, response, rate, dose });
        return { rate, dose };
      } else {
        console.error("String 'overAllHealthRate' not found in the response.");
        return { rate: 0, dose: 0 }; // or handle as needed
      }
    } else {
      console.error('Response is undefined or null.');
      return { rate: 0, dose: 0 }; // or handle as needed
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const ingredientList = ingredients
      .split(',')
      .map((i) => i.trim().toLowerCase());
    const newResults: { [key: string]: { rate: number; dose: number } } = {};

    for (const ingredient of ingredientList) {
      if (ingredient) {
        let healthRating = await getIngredientHealthRating(ingredient);
        while (healthRating.rate === 0) {
          healthRating = await getIngredientHealthRating(ingredient);
        }
        newResults[ingredient] = healthRating;
      }
    }

    setResults(newResults);

    const totalRating = Object.values(newResults).reduce(
      (sum, rating) => sum + rating.rate,
      0
    );
    const avgRating = totalRating / Object.keys(newResults).length;
    setOverallRating(Math.round(avgRating));

    setIsLoading(false);
  };

  const getHealthLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Good for health';
      case 2:
        return 'Use in moderation';
      case 3:
        return 'Bad for health';
      default:
        return 'Unknown';
    }
  };

  const getHealthColor = (rating: number) => {
    switch (rating) {
      case 1:
        return 'text-green-500';
      case 2:
        return 'text-yellow-500';
      case 3:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Packaged Food Ingredients Reviewer</CardTitle>
        <CardDescription>
          Enter the ingredients list from a packaged food item to get health
          ratings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Enter ingredients (comma-separated)"
              className="w-full h-32"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Ingredients'}
          </Button>
        </form>
        {Object.keys(results).length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Ingredient Analysis:</h3>
            <ul className="space-y-2">
              {Object.entries(results).map(([ingredient, { rate, dose }]) => (
                <li
                  key={ingredient}
                  className="flex justify-between items-center"
                >
                  <span className="capitalize">{ingredient}</span>
                  <span className={`font-semibold ${getHealthColor(rate)}`}>
                    Rank {rate} - {getHealthLabel(rate)} (Daily Limit: {dose} mg)
                  </span>
                </li>
              ))}
            </ul>
            {overallRating !== null && (
              <Alert className="mt-4">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Overall Health Rating</AlertTitle>
                <AlertDescription>
                  <span
                    className={`font-semibold ${getHealthColor(overallRating)}`}
                  >
                    {overallRating} - {getHealthLabel(overallRating)}
                  </span>
                </AlertDescription>
                <div className='md:fixed top-4 right-4'>

                <p className='text-xs text-black text-center mb-2 font-bold'>How Rank works ?</p>

                <div className='p-4 text-center bg-black rounded flex flex-col gap-2 justify-center items-center '>
                  <h6 className='text-xs text-green-500'>Rank 1 = Healthy</h6>
                  <h6 className='text-xs text-yellow-500'>Rank 2 = Caution</h6>
                  <h6 className='text-xs text-red-500'>Rank 3 = Harmful</h6>
                </div>
                </div>

              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Component;
