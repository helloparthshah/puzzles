'use client';

import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import {
  Display,
  LargeTitle
} from "@fluentui/react-components";
import World from '../../components/world';

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
        <div
          style={{
            position: "fixed",
            width: "100%",
            height: "100%",
            zIndex: 0,
            backgroundImage: "linear-gradient( #141126 0%, #30255f 100%)"
          }}
        />
        <div className='d-flex flex-column justify-content-center align-items-center' style={{ zIndex: 1 }}>
          <Display align='center' className='mb-3'>
            The Enigma Vault
          </Display>
          <LargeTitle align='center'>
            Welcome to the Enigma Vault! Embark on a journey through a collection of unique puzzle worlds, each filled with intriguing challenges designed to test your logic and creativity. Choose your world and dive in - can you solve them all?
          </LargeTitle>
        </div>
      </Container>
      <Container style={{ minHeight: "100vh", zIndex: "1" }}>
        <LargeTitle style={{ zIndex: "1", position: "relative" }} align='center'>
          Select Your World
        </LargeTitle>
        <Container className="d-flex flex-wrap gap-4 mt-3">
          {worlds.map((world) => (
            <World world = {world} key = {world.id}/>
          ))}
        </Container>
      </Container>
    </>
  );
}