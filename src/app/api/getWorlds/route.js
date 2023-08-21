import { NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'

export async function GET() {
    const puzzlesDirectory = fs.readdirSync(path.join(process.cwd(), 'src/app/api/puzzles'));
    let worlds = []
    for (const file of puzzlesDirectory) {
        const puzzleJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/app/api/puzzles', file), 'utf8'))
        worlds.push({
            id: puzzleJson.id,
            name: puzzleJson.name,
            description: puzzleJson.description,
            image: puzzleJson.image,
        });
        worlds.push({
            id: puzzleJson.id,
            name: puzzleJson.name,
            description: puzzleJson.description,
            image: puzzleJson.image,
        });
        worlds.push({
            id: puzzleJson.id,
            name: puzzleJson.name,
            description: puzzleJson.description,
            image: puzzleJson.image,
        });
        worlds.push({
            id: puzzleJson.id,
            name: puzzleJson.name,
            description: puzzleJson.description,
            image: puzzleJson.image,
        });
    }
    return NextResponse.json(worlds)
}
