import { NextResponse } from "next/server"

export async function POST(request, context) {
    const { world } = await request.json()
    const worldFile = await import(`../puzzles/${world}.json`)
    let puzzles = JSON.parse(JSON.stringify(worldFile.puzzles))
    for (let i = 0; i < puzzles.length; i++) {
        delete puzzles[i].answer
    }
    let worldJson = JSON.parse(JSON.stringify(worldFile))
    worldJson.puzzles = puzzles
    delete worldJson.default
    return NextResponse.json(worldJson)
}