import './StoreContent.css'

export default function Shipping() {
  return (
    <div className="page store-content">
      <header className="store-hero-lite">
        <p className="store-kicker">Delivery</p>
        <h1>Shipping</h1>
        <p>Most orders leave our warehouse within 1 business day.</p>
      </header>
      <div className="store-prose">
        <h2>Rates</h2>
        <ul>
          <li>Free standard shipping on orders $75 and over.</li>
          <li>Standard (3–5 business days): calculated at checkout when under $75.</li>
          <li>You’ll get tracking as soon as the label is created.</li>
        </ul>
        <h2>Where we ship</h2>
        <p>We currently ship within the country. International shipping is coming soon.</p>
        <h2>Delays</h2>
        <p>Weather and carrier issues can add a day or two. If your tracking stalls, contact us with your order number.</p>
      </div>
    </div>
  )
}
