import { useState } from 'react'
import { Link } from 'react-router-dom'
import Shape from '../components/shape'
import './home.css'
import { useEffect } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)
  useEffect(()=> {
    console.log('Home component mounted') //this will run only once when the component is mounted
  }, [])
  
  return (
    <div className="home-page">
      <Shape />
      <h1>I'm learning React</h1>
      <p>I am a beginner and I am learning react</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
      <p>Count is {count}</p>
      <p className="home-auth-links">
        <Link to="/login">Login</Link> · <Link to="/signup">Sign up</Link>
      </p>
    </div>
  )
}