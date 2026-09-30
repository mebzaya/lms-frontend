import './NepaliTypingGuide.css'

const ROWS = [
  ['Vowels', 'a aa i ee u oo e ai o au', 'अ आ इ ई उ ऊ ए ऐ ओ औ'],
  ['Vowel signs', 'ka kaa ki kee ku koo ke kai ko kau', 'क का कि की कु कू के कै को कौ'],
  ['Dental', 't th d dh n', 'त थ द ध न'],
  ['Retroflex (capital)', 'T Th D Dh N', 'ट ठ ड ढ ण'],
  ['S sounds', 's sh Sh', 'स श ष'],
  ['Joined letters', 'x or ksh · gy (start) · jny · rri', 'क्ष · ज्ञ · ज्ञ · ऋ / ृ'],
  ['After a vowel', 'M · ~ · H', 'ं · ँ · ः'],
  ['Other', '. · \\ · 0-9', '। · ् (halant) · ०-९'],
]

const EXAMPLES = [
  ['naatak', 'नातक'],
  ['naaTak', 'नाटक'],
  ['kaaThamaaDauM', 'काठमाडौं'],
  ['gaau~', 'गाउँ'],
]

export default function NepaliTypingGuide() {
  return (
    <details className="nepali-guide">
      <summary>How to type Nepali</summary>
      <p className="nepali-guide-note">
        Type the sound in English letters. Each word turns into नेपाली when you press space or leave the box.
        Capitals only matter for T, D, N, Sh, M and H.
      </p>
      <div className="user-table-wrap">
        <table className="nepali-guide-table">
          <tbody>
            {ROWS.map(([label, roman, devanagari]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td className="nepali-guide-roman">{roman}</td>
                <td className="nepali-guide-devanagari">{devanagari}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="nepali-guide-examples">
        {EXAMPLES.map(([roman, devanagari]) => (
          <span key={roman}>
            <code>{roman}</code> → {devanagari}
          </span>
        ))}
      </p>
    </details>
  )
}
