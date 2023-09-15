#!/bin/sh

set -e  # Exit immediately on error

cleanup() {
    echo "Cleaning up and killing all processes in the current process group"
    # Get the PGID of the current script's process using pgrep
    pgid=$(pgrep -o -P $$)
    # Kill all processes in the current process group using kill with a negative PGID
    kill -- "-$pgid"
}

# Set up a trap to call the cleanup function on script exit
trap cleanup EXIT

# Start the PubSub emulator in the foreground.
gcloud beta emulators pubsub start --host-port=0.0.0.0:8681 --verbosity=debug "$@" &

# Run the wait-for command in the background and capture its PID
/usr/bin/wait-for -t 30 localhost:8681 &
waitfor_pid=$!

wait "$waitfor_pid"

# Check the exit status of the wait-for command
if [ $? -eq 0 ]; then
    (
        env PUBSUB_EMULATOR_HOST=localhost:8681 npm run start
		# Used for docker compose healthcheck
		while true; do { echo -ne "HTTP/1.1 200 OK\r\n"; echo -ne "Content-Length: 0\r\n"; echo -ne "\r\n"; } | nc -l -p 8682 -q 1 & wait $!; done
    ) &
fi

# Wait for the background processes to complete
wait
