import HeroSlider from './Home/HeroSlider'
import CategoryBento from './Home/CategoryBento'
import CuratedLooks from './Home/CuratedLooks.jsx'
import FeaturedClothes from './Home/FeaturedClothes.jsx'
import Wishes from './Home/Wishes.jsx'

const Home = () => {
  return (
    <div>
      <HeroSlider />
      <FeaturedClothes />
      <CategoryBento />
      <CuratedLooks />
      <Wishes />
    </div>
  )
}

export default Home
