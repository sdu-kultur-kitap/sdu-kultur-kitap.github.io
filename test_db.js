import { submitApplication, getMembers, submitSuggestion, getSuggestions } from './firebase-service.js';

async function test() {
    try {
        console.log("Testing submitApplication...");
        const appRes = await submitApplication({
            fullName: "Test User",
            department: "Test Dept",
            grade: "1",
            phone: "05555555555",
            interest: "Test Interest",
            interests: ["Test Interest"],
            date: new Date().toISOString()
        });
        console.log("Application Result:", appRes);

        const members = await getMembers();
        console.log("Members count:", members.length);

        console.log("Testing submitSuggestion...");
        await submitSuggestion({
            name: "Test Sugg User",
            department: "Test Dept",
            title: "Test Title",
            desc: "Test Desc",
            date: new Date().toISOString()
        });
        
        const suggs = await getSuggestions();
        console.log("Suggestions count:", suggs.length);

        console.log("All tests passed.");
    } catch(e) {
        console.error("Test failed:", e);
    }
}
test();
