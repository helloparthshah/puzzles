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
    Label,
    Toaster,
    useToastController,
    Toast,
    useId,
    Link,
    ToastTitle,
    ToastBody,
    ToastFooter,
} from "@fluentui/react-components";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Puzzle({ puzzle, onSubmit }) {
    const toasterId = useId("toaster");
    const { dispatchToast } = useToastController(toasterId);
    const [answer, setAnswer] = useState("");

    useEffect(() => {
        if (!puzzle) {
            window.location.href = "/";
        }
    }, [puzzle]);

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
                        <Button as="a"
                            className="mt-2"
                            appearance="outline"
                            download
                            href={puzzle.question ?? ""}
                        >
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
        <>
            <Toaster toasterId={toasterId} />
            <Container className="d-flex flex-column align-items-center justify-content-around" style={{ height: "100vh" }}>
                <Card
                    appearance="outline"
                    style={{
                        minWidth: "50vw",
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}>
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
                <Card
                    appearance="outline"
                    style={{
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                    }}>
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
                                dispatchToast(
                                    <Toast>
                                        <ToastTitle>
                                            Correct Answer!
                                        </ToastTitle>
                                        <ToastBody>Continue onto the next question</ToastBody>
                                    </Toast>,
                                    { intent: "success" }
                                );
                            } else {
                                dispatchToast(
                                    <Toast>
                                        <ToastTitle>
                                            Incorrect Answer!
                                        </ToastTitle>
                                        <ToastBody>Hint: {puzzle.hint}</ToastBody>
                                    </Toast>,
                                    { intent: "error" }
                                );
                            }
                        }}>
                            Submit
                        </Button>
                    </Container>
                </Card >
            </Container >
        </>
    )
}