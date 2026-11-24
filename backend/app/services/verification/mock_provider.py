from dataclasses import dataclass
from typing import Literal
from uuid import uuid4

verificationOutcome = Literal[
    "approved",
    "rejected",
    "needs_review",
]

@dataclass(frozen=True)
class MockVerificationResult:
    reference: str
    provider: str
    outcome: verificationOutcome
    simulated: bool

class MockVerificationProvider:
    """
    Development-only verification provider.
    
    Does not contact Smile ID or verify real documents.
    """

    provider_name = "mock"
    def verify(
            self,
            *,
            outcome: verificationOutcome = "needs_review",
    ) -> MockVerificationResult:

        if outcome not in (
            "approved",
            "rejected",
            "needs_review",
        ):
            raise ValueError(
                "Unsupported mock verification outcome"
            )

        return MockVerificationResult(
            reference=f"mock_{uuid4().hex}",
            provider=self.provider_name,
            outcome=outcome,
            simulated=True,
        )