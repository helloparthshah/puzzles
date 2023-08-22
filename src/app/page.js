'use client';

import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Button,
  Text,
  Display,
  LargeTitle
} from "@fluentui/react-components";
import Image from "next/image";
import StarfieldAnimation from "react-starfield-animation";

export default function Home() {
  const [worlds, setWorlds] = useState([]);

  useEffect(() => {
    fetch('/api/getWorlds')
      .then((res) => res.json())
      .then((data) => {
        setWorlds(data);
      });
  }, []);

  return (
    <>
      <Container className='d-flex flex-column justify-content-center align-items-center'
        style={{
          height: "100vh",
        }}
      >
        <StarfieldAnimation
          style={{
            position: "fixed",
            width: "100%",
            height: "100%",
            zIndex: 0,
            backgroundImage: "linear-gradient( rgb(0, 0, 0) 0%, rgb(41, 41, 41) 74%)"
          }}
        />
        <div className='d-flex flex-column justify-content-center align-items-center' style={{ zIndex: 1 }}>
          <Display align='center' className='mb-3'>
            Enigma Odyssey
          </Display>
          <LargeTitle align='center'>
            Welcome to the world of puzzles
          </LargeTitle>
        </div>
      </Container>
      <Container style={{ minHeight: "100vh", zIndex: "1" }}>
        <LargeTitle style={{ zIndex: "1", position: "relative" }} align='center'>
          Select Your World
        </LargeTitle>
        <Container className="d-flex flex-wrap gap-4 mt-3">
          {worlds.map((world) => (
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
                <CardFooter>
                  <Button as="a" className="mt-2" appearance="outline" href={`/worlds/${world.id}`}>
                    Play
                  </Button>
                </CardFooter>

              </Card>
            </Col>
          ))}
        </Container>
      </Container>
    </>
  );
}