'use client';

import React, { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Button,
} from "@fluentui/react-components";
import Image from "next/image";

export default function Home() {
  const [worlds, setWorlds] = useState([]);

  useEffect(() => {
    fetch('/api/getWorlds')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setWorlds(data);
      });
  }, []);

  return (
    <>
      <h1>Home</h1>
      <Container className="d-grid gap-3">
        {worlds.map((world) => (
          <Card className='subtle' key={world.id} style={{ width: "40%" }}>
            <CardPreview >
              <Container style={{ height: "200px", position: "relative" }}>
                <Image
                  src={world.image ?? ""}
                  alt={world.name}
                  style={{ objectFit: "contain" }}
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
              <Button className="mt-2" appearance="outline" onClick={() => { window.location.href = "/worlds/" + world.id }}>
                Play
              </Button>
            </CardFooter>

          </Card>
        ))}
      </Container>
    </>
  );
}