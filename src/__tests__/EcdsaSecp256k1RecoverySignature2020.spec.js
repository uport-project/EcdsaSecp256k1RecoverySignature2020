import jsigs from "@digitalcredentials/jsonld-signatures";
import {issue, verifyCredential} from "@digitalcredentials/vc";
import EcdsaSecp256k1RecoveryMethod2020 from "../EcdsaSecp256k1RecoveryMethod2020";
import EcdsaSecp256k1RecoverySignature2020 from "../EcdsaSecp256k1RecoverySignature2020";
import unclockedDID from "../../docs/unlockedDID.json";
import sampleCredential from "../../docs/credential.json";
import staticVerifiableCredential from "../../docs/verifiableCredential.json";
import {documentLoader} from "./__fixtures__";

const {AssertionProofPurpose} = jsigs.purposes;
let clockedDID = Object.assign({}, unclockedDID);
delete clockedDID.proof

const regenerate = !!process.env.REGENERATE_TEST_VECTORS;

describe("EcdsaSecp256k1RecoverySignature2020", () => {
    unclockedDID.verificationMethod.forEach((vm) => {
        describe(vm.id, () => {
            let vm1 = new EcdsaSecp256k1RecoveryMethod2020(vm);
            let suite = new EcdsaSecp256k1RecoverySignature2020({
                key: vm1,
            });

            describe("jsigs", () => {
                it("should work as valid signature suite for signing and verifying a document", async () => {
                    // We need to do that because jsigs.sign modifies the credential... no bueno
                    const signed = await jsigs.sign(clockedDID, {
                        compactProof: false,
                        documentLoader: documentLoader,
                        purpose: new AssertionProofPurpose(),
                        suite,
                    });
                    expect(signed.proof).toBeDefined();
                    const result = await jsigs.verify(signed, {
                        compactProof: false,
                        documentLoader: documentLoader,
                        purpose: new AssertionProofPurpose(),
                        suite,
                    });
                    expect(result.verified).toBeTruthy();

                    if (!regenerate) {
                        // Verify static signed document
                        const result = await jsigs.verify(unclockedDID, {
                            compactProof: false,
                            documentLoader: documentLoader,
                            purpose: new AssertionProofPurpose(),
                            suite,
                        });
                        expect(result.verified).toBeTruthy();
                    }
                });
            });

            describe("vc-js", () => {
                it("should work as valid signature suite for issuing and verifying a credential", async () => {
                    const verifiableCredential = await issue({
                        credential: sampleCredential,
                        documentLoader: documentLoader,
                        compactProof: false,
                        suite,
                        now: "2020-01-01T00:00:00Z",
                    });
                    expect(verifiableCredential.proof).toBeDefined();

                    const result = await verifyCredential({
                        credential: verifiableCredential,
                        compactProof: false,
                        documentLoader: documentLoader,
                        purpose: new AssertionProofPurpose(),
                        suite,
                        now: "2020-01-01T00:00:00Z",
                    });
                    expect(result.verified).toBeTruthy();

                    if (!regenerate) {
                        // Verify static verifiable credential
                        const result1 = await verifyCredential({
                            credential: staticVerifiableCredential,
                            compactProof: false,
                            documentLoader: documentLoader,
                            purpose: new AssertionProofPurpose(),
                            suite,
                        });
                        expect(result.verified).toBeTruthy();
                    }
                });
            });
        });
    });

    if (regenerate) {
        describe('Saving regenerated test vectors', () => {
            const fs = require('fs');
            const path = require('path');
            it("to verifiableCredential.json", async () => {
                const vc = JSON.stringify(verifiableCredential, 0, 2);
                const filename = path.join(__dirname, "../../docs/verifiableCredential.json");
                fs.writeFileSync(filename, vc + '\n');
            });
            it("to unlockedDID.json", async () => {
                const doc = JSON.stringify(clockedDID, 0, 2);
                const docFilename = path.join(__dirname, "../../docs/unlockedDID.json");
                fs.writeFileSync(docFilename, doc + '\n');
            });
        })
    }
});
