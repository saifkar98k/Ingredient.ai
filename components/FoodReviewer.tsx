'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { InfoIcon } from "lucide-react"
import Image from "next/image"
import Groq from 'groq-sdk'
import Logo from '@/public/logo.png'


const client = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true,
})

export default function Component() {
  const [ingredients, setIngredients] = useState('')
  const [results, setResults] = useState<{ [key: string]: { rate: number; dose: number } }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [overallRating, setOverallRating] = useState<number | null>(null)

  const getIngredientHealthRating = async (ingredient: string): Promise<{ rate: number; dose: number }> => {
    const prompt = `What is the health rating for ${ingredient}?, rate ingredients returns the 1,2,3 if 1 means good for health, 2 means use in limit and 3 means bad for health, I just need rating number object with key overAllHealthRate and dailyLimitedDosage in milli-grams no additional data or information`
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-70b-versatile',
    })

    const response = chatCompletion.choices[0]?.message?.content
    if (response) {
      const splitResponse = response.split(':')
      if (splitResponse.length > 1) {
        const trimmedString = splitResponse[1]?.replace(/[^0-9]/g, '')
        const rate = Number(trimmedString)
        const dose = Number(splitResponse[2]?.replace(/[^0-9]/g, ''))
        return { rate, dose }
      }
    }
    return { rate: 0, dose: 0 }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const ingredientList = ingredients.split(',').map((i) => i.trim().toLowerCase())
    const newResults: { [key: string]: { rate: number; dose: number } } = {}

    for (const ingredient of ingredientList) {
      if (ingredient) {
        let healthRating = await getIngredientHealthRating(ingredient)
        let counter = 0
        while (healthRating.rate === 0 && counter < 3) {
          healthRating = await getIngredientHealthRating(ingredient)
          counter++
        }
        newResults[ingredient] = healthRating
      }
    }

    setResults(newResults)

    const totalRating = Object.values(newResults).reduce((sum, rating) => sum + rating.rate, 0)
    const avgRating = totalRating / Object.keys(newResults).length
    setOverallRating(Math.round(avgRating))

    setIsLoading(false)
  }

  const getHealthLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Good for health'
      case 2:
        return 'Use in moderation'
      case 3:
        return 'Bad for health'
      default:
        return `AI couldn't match health ranking. Refine your search`
    }
  }

  const getHealthColor = (rating: number) => {
    switch (rating) {
      case 1:
        return 'text-green-500'
      case 2:
        return 'text-yellow-500'
      case 3:
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-black mt-2 text-white border border-gray-600">
      <CardHeader>
        <Image src={Logo} alt="Logo" width={144} height={36} className="w-36" />
        <p className="text-[#FF9933] font-bold">
          Lable <span className="text-white">Padhega</span> <span className="text-[#138808]">India</span>
        </p>
        <CardTitle className="text-white">Packaged Food Ingredients Reviewer</CardTitle>
        <CardDescription className="text-gray-400">
          Enter the ingredients list from a packaged food item to get health ratings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Enter ingredients (comma-separated)"
              className="w-full h-32 bg-gray-800 text-white border-gray-700"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Ingredients'}
          </Button>
        </form>
        {Object.keys(results).length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-white">Ingredient Analysis:</h3>
            <ul className="space-y-4">
              {Object.entries(results).map(([ingredient, { rate, dose }]) => (
                <li
                  key={ingredient}
                  className="flex flex-col md:flex-row md:justify-between md:items-center border-gray-700 border-b m-2"
                >
                  <span className="capitalize text-white">{ingredient}</span>
                  <span className={`font-semibold ${getHealthColor(rate)}`}>
                    {rate && rate > 0 && rate <= 3
                      ? `Rank ${rate} - ${getHealthLabel(rate)}${dose && dose > 0 ? ` (Daily Limit - ${dose} mg)` : ''}`
                      : "AI unable to match health ranking. Refine your search."}
                  </span>
                </li>
              ))}
            </ul>
            {overallRating !== null && (
              <Alert className="mt-4 bg-gray-800 border-gray-700">
                <InfoIcon className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-white">Overall Health Rating</AlertTitle>
                <AlertDescription>
                  <span className={`font-semibold ${getHealthColor(overallRating)}`}>
                    Rank {overallRating} - {getHealthLabel(overallRating)}
                  </span>
                </AlertDescription>
                <div className="md:fixed top-4 right-6 w-64">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-xs font-bold text-white">
                        How Rank works?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 text-center shadow-2xl transition-all ease-in-out border border-gray-700 rounded flex flex-col gap-2 justify-center items-center bg-gray-800">
                          <h6 className="text-xs text-green-500">Rank 1 = Healthy</h6>
                          <h6 className="text-xs text-yellow-500">Rank 2 = Caution</h6>
                          <h6 className="text-xs text-red-500">Rank 3 = Harmful</h6>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </Alert>
            )}
          </div>
        )}
        <p className="font-medium text-xs mt-4 text-end text-gray-400">Project by Saif and Team</p>
      </CardContent>
    </Card>
  )
}