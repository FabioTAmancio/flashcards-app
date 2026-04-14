import { useEffect, useState } from 'react'
import { reviewService } from '../services/review.service'

type Flashcard = {
    id: number
    front: string
    back: string
}

export default function ReviewPage() {
    const [cards, setCards] = useState<Flashcard[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showAnswer, setShowAnswer] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCards()
    }, [])

    async function loadCards() {
        try {
            const data = await reviewService.getDueFlashcards()
            setCards(data)
        } catch(err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function handleShowAnswer() {
        setShowAnswer(true)
    }

    async function handleReview(quality: number) {
        const card = cards[currentIndex]

        await reviewService.review(card.id, quality)

        setShowAnswer(false)
        setCurrentIndex((prev) => prev + 1)
    }

    if(loading) {
        return <div className='text-center mt-20'>Loading...</div>
    }

    if(cards.length === 0 || currentIndex >= cards.length) {
        return (
            <div className='text-center mt-20'>
                <h2 className='text-xl font-bold'>Finished Review</h2>
                <p className='text-gray-500 mt-2'>Back Tomorrow</p>
            </div>
        )
    }

    const card = cards[currentIndex]

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 p-6'>
            <div className='bg-white w-full max-w-xl rounded-2xl shadow p-6'>

                {/* Progress */}
                <div className='text-sm text-gray-400 mb-4'>
                    {currentIndex + 1} / {cards.length}
                </div>

                {/* CARD */}
                <div className='min-h-[150px] flex items-center justify-center text-center'>
                    {!showAnswer ?  (
                        <p className='text-lg font-medium'>{card.front}</p>
                    ) : (
                        <p className='text-lg text-indigo-600'>{card.back}</p>
                    )}
                </div>

                {/* BUTTON */}
                <div className='mt-6 flex justify-center gap-3'>
                    {! showAnswer ? (
                        <button
                            onClick={handleShowAnswer}
                            className='px-6 py-2 bg-indigo-600 text-white rounded-lg'
                        >
                            Show Answer
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleReview(0)}
                                className='px-4 py-2 bg-red-500 text-white rounded-lg'
                            >
                                Again
                            </button>

                            <button
                                onClick={() => handleReview(3)}
                                className='px-4 py-2 bg-orange-500 text-white rounded-lg'
                            >
                                Hard
                            </button>

                            <button
                                onClick={() => handleReview(4)}
                                className='px-4 py-2 bg-blue-500 text-white rounded-lg'
                            >
                                Good
                            </button>

                            <button
                                onClick={() => handleReview(5)}
                                className='px-4 py-2 bg-green-500 text-white rounded-lg'
                            >
                                Easy
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
} 