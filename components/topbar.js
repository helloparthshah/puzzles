import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import {
    makeStyles,
    shorthands,
    Tab,
    TabList,
    TabListProps,
} from "@fluentui/react-components";
import { useState } from 'react';

export default function Topbar() {
    const [selected, setSelected] = useState("tab1");

    const solvedSVG = <svg stroke="#559943" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>

    const lockedSVG = <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" class="bi bi-lock-fill" strokeWidth="2" viewBox="0 0 20 20">
        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    </svg>

    const solved = true;
    return (
        <Container className="flex-column w-25 h-100 bg-darker" style={{ position: "fixed" }}>
            <h2>Quiz Answers de bro!</h2>
            <div>
                <TabList vertical='true' selectedValue={selected} onTabSelect={(e, props) => { setSelected(props.value) }}>
                    <Tab value="tab1">
                        {"Puzzle 1 "}
                        {solvedSVG}
                    </Tab>
                    <Tab value="tab2" >Puzzle 2</Tab>
                    <Tab value="tab3" disabled>
                        {"Puzzle 3 "}
                        {lockedSVG}
                    </Tab>
                    <Tab value="tab4" disabled>Puzzle 4</Tab>
                </TabList>
            </div>
        </Container>
    );
};