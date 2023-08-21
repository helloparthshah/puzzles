import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import {
    makeStyles,
    shorthands,
    Tab,
    TabList,
    TabListProps,
} from "@fluentui/react-components";
import { useState, useEffect } from 'react';
import solved from 'public/solved.svg'
import locked from 'public/lock.svg'
import Image from 'next/image';

export default function Topbar({ name, puzzles, selected, setSelected }) {
    return (
        <Container className="flex-column w-25 h-100 bg-darker" style={{ position: "fixed" }}>
            <h2>{name}</h2>
            <div>
                <TabList vertical='true' selectedValue={selected} onTabSelect={(e, props) => { setSelected(props.value) }}>
                    {
                        puzzles.length > 0 ? (puzzles.map((puzzle) => {
                            return (
                                <Tab value={puzzle.id} disabled={puzzle.disabled}>
                                    {puzzle.name}
                                    <span className='ms-2'>
                                        {puzzle.disabled ? <Image
                                            src={locked}
                                            alt="Locked"
                                            width={20}
                                            height={20}
                                        /> : (puzzle.solved ? <Image
                                            src={solved}
                                            alt="Solved"
                                            width={20}
                                            height={20}
                                        /> : <></>)}
                                    </span>
                                </Tab>
                            )
                        })) : <></>
                    }
                    {/* <Tab value="tab1">
                        {"Puzzle 1 "}
                        {solvedSVG}
                    </Tab>
                    <Tab value="tab2" >Puzzle 2</Tab>
                    <Tab value="tab3" disabled>
                        {"Puzzle 3 "}
                        {lockedSVG}
                    </Tab>
                    <Tab value="tab4" disabled>Puzzle 4</Tab> */}
                </TabList>
            </div>
        </Container>
    );
};