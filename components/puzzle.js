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
    Input,
    Label
} from "@fluentui/react-components";
import * as React from "react";
import Image from "next/image";

export default function Puzzle({ puzzle, onSubmit }) {
    const [answer, setAnswer] = React.useState("");

    function renderQuestion() {
        switch (puzzle.type) {
            case "image":
                return (
                    <>
                        <Container style={{ height: "300px", position: "relative" }}>
                            <Image
                                src={puzzle.question ?? ""}
                                alt={puzzle.name ?? ""}
                                style={{ objectFit: "contain" }}
                                fill={true}
                            />
                        </Container>
                        <Button className="mt-2" appearance="outline" onClick={() => {
                            window.open(puzzle.question ?? "", "_blank");
                        }}>
                            Download
                        </Button>
                    </>
                );
            default:
                return (
                    <Text>
                        {puzzle.question ?? ""}
                    </Text>
                );
        }
    }

    return (
        <Container className="d-flex flex-column align-items-center justify-content-around" style={{ height: "100vh" }}>
            <Card style={{ minWidth: "50vw" }}>
                <CardHeader
                    header={
                        <Body1>
                            <b>{puzzle.name ?? ""}</b>
                        </Body1>
                    }
                    description={<Caption1>Hint: {puzzle.hint ?? ""}</Caption1>}
                />
                <Container className="m-2 mt-0">
                    <p>
                        <Text>
                            {puzzle.description ?? ""}
                        </Text>
                    </p>
                    <CardPreview>
                        <p>
                            {renderQuestion()}
                        </p>
                    </CardPreview>
                </Container>
            </Card>
            <Card>
                <Container className="m-2 d-flex flex-column align-items-center justify-content-around">
                    <Label htmlFor="answer">
                        Answer
                    </Label>
                    <Input id="answer" placeholder="Type your answer here" value={answer} onChange={(e) => {
                        setAnswer(e.target.value)
                    }} />
                    <Button className="mt-2" appearance="outline" onClick={async () => {
                        let isCorrect = await onSubmit(answer);
                        if (isCorrect) {
                            setAnswer("");
                            alert("Correct answer!");
                        } else {
                            alert("Incorrect answer!");
                        }
                    }}>
                        Submit
                    </Button>
                </Container>
            </Card>
        </Container>
    )
}