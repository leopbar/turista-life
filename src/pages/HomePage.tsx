import { About } from '../components/About'
import { Brands } from '../components/Brands'
import { Diary } from '../components/Diary'
import { Hero } from '../components/Hero'
import { Products } from '../components/Products'
import { Recommendations } from '../components/Recommendations'
import { Sections } from '../cms/Sections'

export function HomePage() {
  return (
    <Sections
      page="home"
      items={{
        hero: <Hero />,
        about: <About />,
        products: <Products />,
        recommendations: <Recommendations />,
        brands: <Brands />,
        diary: <Diary />,
      }}
    />
  )
}
