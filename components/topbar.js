import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col } from 'react-bootstrap';
import {
    makeStyles,
    shorthands,
    Tab,
    TabList,
    TabListProps,
    Divider,
    ToolbarButton,
    Text,
    Link
} from "@fluentui/react-components";
import {
    ArrowLeft24Regular
} from "@fluentui/react-icons";
import { useState, useEffect } from 'react';
import solved from 'public/solved.svg'
import locked from 'public/lock.svg'
import Image from 'next/image';

export default function Topbar({ name, puzzles, selected, setSelected }) {
    return (
        <Container className="d-flex flex-column w-25 h-100 bg-darker justify-content-between" style={{ position: "fixed" }}>
            <div>
                <ToolbarButton icon={<ArrowLeft24Regular />} as="a" href={"/"} />
                <h2>{name}</h2>
                <Divider />
                <TabList
                    className='mt-3'
                    vertical='true'
                    selectedValue={selected} onTabSelect={
                        (e, props) => {
                            setSelected(props.value)
                        }}
                >
                    {
                        puzzles.length > 0 ? (puzzles.map((puzzle) => {
                            return (
                                <Tab
                                    value={puzzle.id}
                                    disabled={puzzle.disabled}
                                    className='mt-2'
                                    key={puzzle.id}
                                >
                                    {puzzle.name}
                                    <span>
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
                </TabList>
            </div>
            <span className='mb-5'>
                <Divider className='mb-2' />
                <Text className='mt-3'>Made with ❤️ by <Link href="https://github.com/helloparthshah">Parth Shah</Link> and <Link href="https://github.com/kunpai">Kunal Pai</Link></Text>
            </span>
        </Container>
    );
};