import { About } from '../components/About'
import { Brands } from '../components/Brands'
import { Diary } from '../components/Diary'
import { Hero } from '../components/Hero'
import { Products } from '../components/Products'
import { Recommendations } from '../components/Recommendations'

export function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Products />
      <Recommendations />
      <Brands />
      <Diary />
    </>
  )
}
