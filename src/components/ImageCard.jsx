export default function ImageCard({ image, caption }) {
  return (
    <figure className="card">
      <a href={image.pageURL} target="_blank" rel="noreferrer">
        <img src={image.webformatURL} alt={image.tags} loading="lazy" />
      </a>
      <figcaption>
        {caption && <strong>{caption}</strong>}
        <span>© {image.user} / Pixabay</span>
      </figcaption>
    </figure>
  )
}
