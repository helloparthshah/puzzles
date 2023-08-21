'use client';

// Import necessary dependencies from '@fluentui/react-components'
import {
    makeStyles,
    shorthands,
    Text,
    Title1,
    tokens,
} from '@fluentui/react-components';
import { Col, Container } from 'react-bootstrap';
import Topbar from '/components/topbar';
import Puzzle from '/components/puzzle';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'

export default function Page() {
    const params = useParams()
    const [puzzles, setPuzzles] = useState([]);
    const [name, setName] = useState([]);
    const [selected, setSelected] = useState("");

    useEffect(() => {
        // get world from /worlds/world
        console.log(params.world);
    }, [params]);

    useEffect(() => {
        fetch('/api/getAllPuzzlesForWorld', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ world: params.world }),
        })
            .then((res) => res.json())
            .then((data) => {
                let dataPuzzles = data.puzzles;
                for (let i = 0; i < dataPuzzles.length; i++) {
                    dataPuzzles[i].solved = false;
                    dataPuzzles[i].disabled = false;
                }
                dataPuzzles[0].disabled = false;
                setPuzzles(dataPuzzles);
                setName(data.name);
                setSelected(dataPuzzles[0].id);
            });
    }, []);

    async function onSubmit(answer) {
        let isCorrect = await fetch('/api/checkAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ answer: answer, id: selected, world: params.world }),
        })
            .then((res) => res.json())
            .then((data) => {
                return data;
            });
        if (isCorrect) {
            let newPuzzles = JSON.parse(JSON.stringify(puzzles));
            for (let i = 0; i < newPuzzles.length; i++) {
                if (newPuzzles[i].id === selected) {
                    newPuzzles[i].solved = true;
                    if (i + 1 < newPuzzles.length) {
                        newPuzzles[i + 1].disabled = false;
                    }
                }
            }
            setPuzzles(newPuzzles);
        }
        return isCorrect;
    }

    return (
        <>
            <Topbar name={name} puzzles={puzzles} selected={selected} setSelected={setSelected} />
            <Col className="w-75" style={{ marginLeft: "25%" }}>
                <Puzzle puzzle={(puzzles.find((p) => p.id === selected)) ?? {}} onSubmit={onSubmit} />
            </Col>
        </>
    );
}