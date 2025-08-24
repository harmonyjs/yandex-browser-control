async function main() {
    console.error('Server started');
    // Quit the application
    process.exit(0);
}

main().catch(err => {
    console.error(err); 
    process.exit(1);
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));