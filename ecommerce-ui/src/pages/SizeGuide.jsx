import { Link } from 'react-router-dom'
import './StoreContent.css'

const ROWS = [
  ['US', '6', '7', '8', '9', '10', '11', '12', '13'],
  ['UK', '5.5', '6.5', '7.5', '8.5', '9.5', '10.5', '11.5', '12.5'],
  ['EU', '39', '40', '41', '42', '43', '44', '45', '46'],
  ['CM', '24', '25', '26', '27', '28', '29', '30', '31'],
]

export default function SizeGuide() {
  return (
    <div className="page store-content">
      <header className="store-hero-lite">
        <p className="store-kicker">Fit</p>
        <h1>Size guide</h1>
        <p>Measure both feet in the afternoon—they’re usually slightly larger then. Use the longer foot.</p>
      </header>
      <div className="store-prose">
        <div className="size-table-wrap">
          <table className="size-table">
            <tbody>
              {ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    i === 0 ? <th key={cell}>{cell}</th> : <td key={`${row[0]}-${cell}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>How to measure</h2>
        <ol>
          <li>Stand on paper in the socks you’ll wear with the shoes.</li>
          <li>Trace your heel and longest toe.</li>
          <li>Measure heel-to-toe in centimeters and match the CM row.</li>
        </ol>
        <p>Between sizes? Most of our everyday sneakers run true to size. If you have a wider foot, go up half a size.</p>
        <p><Link to="/shop">Shop shoes</Link> or <Link to="/returns">read about free size exchanges</Link>.</p>
      </div>
    </div>
  )
}
