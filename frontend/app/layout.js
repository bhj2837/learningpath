import './globals.css'

export const metadata = {
  title: 'LearningPath - AI 맞춤 학습 로드맵',
  description: 'AI가 목표에 맞는 개인화된 학습 로드맵을 30초 만에 생성해드립니다.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
