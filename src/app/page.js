'use client';

// Import necessary dependencies from '@fluentui/react-components'
import {
  makeStyles,
  shorthands,
  Text,
  Title1,
  tokens,
} from '@fluentui/react-components';
import { Col } from 'react-bootstrap';
import Topbar from '../../components/topbar';
import Puzzle from '../../components/puzzle';

import { Container } from 'react-bootstrap';

export default function Home() {

  return (
    <>
      <Topbar />
      <Col className="w-75" style={{ marginLeft: "25%" }}>
        <Puzzle />
      </Col>
    </>
  );
}