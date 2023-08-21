import { NextResponse } from "next/server"

export async function POST(request, context) {
    // get id from body
    const { id, answer, world } = await request.json()
    console.log(id, answer, world)
    const worldJson = await import(`../puzzles/${world}.json`)
    let puzzles = JSON.parse(JSON.stringify(worldJson.puzzles))
    for (const puzzle of puzzles) {
        if (puzzle.id === id) {
            if (puzzle.answer.toLowerCase() === answer.toLowerCase()) {
                return NextResponse.json(true)
            }
        }
    }
    return NextResponse.json(false)
}