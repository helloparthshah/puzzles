import { NextResponse } from "next/server"

export async function POST(request, context) {
    const { world } = await request.json()
    const worldFile = await import(`../puzzles/${world}.json`)
    let puzzles = worldFile.puzzles
    for (let i = 0; i < puzzles.length; i++) {
        delete puzzles[i].answer
    }
    let worldJson = JSON.parse(JSON.stringify(worldFile))
    worldJson.puzzles = puzzles
    return NextResponse.json(worldJson)
}