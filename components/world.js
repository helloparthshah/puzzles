import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Col } from 'react-bootstrap';
import { useProgress } from '/hooks/useProgress';
import Image from 'next/image';
import {
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
    Button
} from "@fluentui/react-components";
import solved from 'public/solved.svg'
import { useCallback, useEffect, useState } from 'react';


export default function World({ world }) {
    const {
        worldProgress,
        isReady: progressReady,
        getSolvedPuzzles } = useProgress(world.id);

    const [puzzles, setPuzzles] = useState([])

    const loadPuzzles = useCallback(async () => {
        const response = await fetch('/api/getAllPuzzlesForWorld', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ world: world.id }),
        });
        const data = await response.json();
        setPuzzles(data.puzzles);
    }, [world]);

    useEffect(() => {
        if (world.puzzles) {
            setPuzzles(world.puzzles);
        } else {
            loadPuzzles();
        }
    }, [world.puzzles, loadPuzzles]);

    const isSolved = (worldId) => {
        if (!progressReady) return false;
        console.log("worldProgress", worldProgress)
        console.log("puzzles", puzzles)
        console.log("getSolvedPuzzles", getSolvedPuzzles(worldId))
        console.log("puzzles.length", puzzles.length === getSolvedPuzzles(worldId).length)
        return puzzles.length === getSolvedPuzzles(worldId).length;
    }

    return (
        <Col key={world.id} xs={12} md={5} lg={3}>
            <Card className='subtle' key={world.id} style={{ minHeight: "400px" }}>
                <CardPreview >
                    <Container style={{ height: "200px", position: "relative" }}>
                        <Image
                            src={world.image ?? ""}
                            alt={world.name}
                            style={{ objectFit: "cover" }}
                            fill={true}
                        />
                    </Container>
                </CardPreview>
                <CardHeader
                    header={
                        <h3>
                            {world.name}
                        </h3>
                    }
                    description={world.description}
                />
                <CardFooter className="flex justify-content-between align-items-center">
                    <Button as="a" className="mt-2" appearance="outline" href={`/worlds/${world.id}`}>
                        Play
                    </Button>
                    {isSolved(world.id) && (
                        <div className='mt-2 d-flex align-items-center'>
                            <Image
                                src={solved}
                                alt="Solved"
                                style={{ width: "20px", height: "20px", marginLeft: "10px" }}
                            />
                            <span className='ms-2' style={{ color: "green" }}>
                                Solved
                            </span>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </Col>
    );
};