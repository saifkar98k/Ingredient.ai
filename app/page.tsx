import FoodReviewer from '@/components/FoodReviewer';

export default function Home() {
  return (<>
      <FoodReviewer/>

  <div className=' p-4 text-center bg-black'>
<h6 className='text-xs mb-2 text-green-500'>Rank 3 === Healthy</h6>
<h6 className='text-xs mb-2 text-yellow-500'>Rank 2 === Caution</h6>
<h6 className='text-xs mb-2 text-red-500'>Rank 1 === Harmful</h6>
</div>
<h1>Hello World</h1>
</>
);
}
