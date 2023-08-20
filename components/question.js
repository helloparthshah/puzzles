import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
// import { Stack } from '@fluentui/react';

export default function Question({ puzzle }) {
    // depending on if the puzzle is solved or not, change render solved or not solved
    const solved = true;

    return (
        <Container>
            <Row className='d-flex justify-content-between question-container'>
                <Col xs="auto">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span> {puzzle}</span>
                </Col>
                <Col xs="auto">
                    {solved ? (
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    ) : (
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12l2 2 4-4"></path>
                        </svg>
                    )}
                </Col>
            </Row>
        </Container>
    );
}
