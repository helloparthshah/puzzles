import { Container } from "react-bootstrap"
import {
    makeStyles,
    Body1,
    Caption1,
    Button,
    shorthands,
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
    Text,
    Input
} from "@fluentui/react-components";
import * as React from "react";

import { ArrowReplyRegular, ShareRegular } from "@fluentui/react-icons";

export default function Puzzle() {
    return (
        <Container className="d-flex flex-column align-items-center justify-content-around" style={{ height: "100vh" }}>
            <Card>
                <CardHeader
                    header={
                        <Body1>
                            <b>Puzzle #1</b>
                        </Body1>
                    }
                    description={<Caption1>5h ago · About us - Overview</Caption1>}
                />
                <CardPreview>
                    <Container className="m-2 mt-0">
                        <Text>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                            convallis libero in dui cursus, sit amet maximus leo
                            pellentesque. Nulla facilisi. Donec euismod, nisl ac
                            consectetur dapibus, velit diam vulputate augue, sed
                            consectetur nunc velit nec nisi. Donec euismod, nisl ac
                            consectetur dapibus, velit diam vulputate augue, sed
                            consectetur nunc velit nec nisi.
                        </Text>
                    </Container>
                </CardPreview>
            </Card>
            <Card>
                <Container className="m-2 d-flex flex-column align-items-center justify-content-around">
                    <Input placeholder="Type your answer here" />
                    <Button className="mt-2" appearance="primary">
                        Submit
                    </Button>
                </Container>
            </Card>
        </Container>
    )
}