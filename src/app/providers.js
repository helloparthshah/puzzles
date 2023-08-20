'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css'
// Import necessary dependencies from 'react'
import { useEffect, useState } from 'react'
// Import necessary dependencies from '@fluentui/react-components'
import {
  createDOMRenderer,
  RendererProvider,
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  SSRProvider,
} from '@fluentui/react-components';
import Topbar from '../../components/topbar';
import { Container, Row, Col } from 'react-bootstrap';

// Create a DOM renderer for Fluent UI.
const renderer = createDOMRenderer();

/**
 * Providers component.
 *
 * This component wraps other components with a set of providers
 * for Fluent UI, SSR, and a custom renderer.
 *
 * @param {Object} props - The properties for the Providers component.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the Providers.
 * @returns {React.Element} The Providers component with child components.
 */
export function Providers({ children }) {
  // Declare a state variable named 'hasMounted' and a function named 'setHasMounted' to update it.
  const [hasMounted, setHasMounted] = useState(false);

  // Use the 'useEffect' hook to set 'hasMounted' to true once the component has mounted.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // If the component hasn't mounted yet, return nothing.
  if (!hasMounted) {
    return null;
  }

  // If the component has mounted, return a set of providers.
  return (
    <RendererProvider renderer={renderer || createDOMRenderer()}>
      <SSRProvider>
        <FluentProvider theme={webDarkTheme} style={{ minHeight: "100vh" }}>
          <Topbar />
          <Col className="w-75" style={{ marginLeft: "25%" }}>
            {children}
          </Col>
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}