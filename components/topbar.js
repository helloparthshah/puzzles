import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
    makeStyles,
    shorthands,
    Tab,
    TabList,
    TabListProps,
} from "@fluentui/react-components";

export default function Topbar() {
    const solvedSVG = <svg stroke="#559943" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    const solved = true;
    return (
        <Container className="flex-column w-25 h-100 bg-darker" style={{ position: "fixed" }}>
            <h2>Quiz Answers de bro!</h2>
            <div>
                <TabList vertical='true'>
                    <Tab value="tab1" active>
                        {"Puzzle 1 "}
                        {solvedSVG}
                    </Tab>
                    <Tab value="tab2">Puzzle 2</Tab>
                    <Tab value="tab3">Puzzle 3</Tab>
                    <Tab value="tab4">Puzzle 4</Tab>
                </TabList>
            </div>
        </Container>
    );
};