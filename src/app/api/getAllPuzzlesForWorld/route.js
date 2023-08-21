import { NextResponse } from "next/server"

export async function POST(request, context) {
    const { world } = await request.json()
    const puzzles = await import(`../puzzles/${world}.json`)

    for (let i = 0; i < puzzles.length; i++) {
        delete puzzles[i].answer
    }
    return NextResponse.json(puzzles)
}