import { useState } from 'react'
import './shape.css'

export default function Shape(){
    const [color, setColor] = useState('red')
    return (
        <>
        <div className='shape' style={{ backgroundColor: color }}>
        </div>
        <button onClick={()=> setColor(color=== 'red' ? 'blue' : 'red')}>Change color</button>
    
        </>
    )
}