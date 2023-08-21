import { NextResponse } from "next/server"

export async function POST(request, context) {
    // get id from body
    const { id, answer, world } = await request.json()
    const puzzles = await import(`../puzzles/${world}.json`)
    for (const puzzle of puzzles.puzzles) {
        if (puzzle.id === id) {
            console.log(puzzle.answer, answer)
            if (puzzle.answer.toLowerCase() === answer.toLowerCase()) {
                return NextResponse.json(true)
            }
        }
    }
    return NextResponse.json(false)
}