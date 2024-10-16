# Configuring Keytar on Linux Systems

This tutorial will guide you through the process of setting up and troubleshooting keytar on Linux systems, particularly in environments where the GNOME keyring may not be properly configured.

## Prerequisites

- Node.js and npm installed
- `keytar` package installed in your project

## Step 1: Verify System Dependencies

1. Install necessary system packages:

   For Ubuntu/Debian:
   ```bash
   sudo apt-get install libsecret-1-dev gnome-keyring libsecret-tools
   ```

   For Fedora/RHEL:
   ```bash
   sudo dnf install libsecret-devel gnome-keyring
   ```

2. Verify libsecret installation:
    ```bash
   pkg-config --libs libsecret-1
    ```
   Expected output: `-lsecret-1 -lgio-2.0 -lgobject-2.0 -lglib-2.0`

## Step 2: Set Up D-Bus Session

1. Check if D-Bus session is running:
    ```bash
   echo $DBUS_SESSION_BUS_ADDRESS
    ```

2. If empty, start a D-Bus session:
    ```bash
   eval $(dbus-launch --sh-syntax)
    ```

## Step 3: Configure GNOME Keyring

1. Start the GNOME keyring daemon:
    ```bash
   eval $(gnome-keyring-daemon --start --components=secrets,ssh)
   export SSH_AUTH_SOCK
    ```

2. Verify the keyring daemon is running:
    ```bash
   ps aux | grep gnome-keyring-daemon
    ```

3. Set the GNOME keyring control environment variable:
    ```bash
   export GNOME_KEYRING_CONTROL=$(ls -d /run/user/$UID/keyring*/ 2>/dev/null | head -n 1)
    ```

## Step 4: Test Keytar

1. Create a test script `test-keytar.js`:

    ```javascript
   const keytar = require('keytar'); // import keytar from 'keytar';

   async function testKeytar() {
     try {
       await keytar.setPassword('TestService', 'TestAccount', 'TestPassword');
       console.log('Password set successfully');
       const password = await keytar.getPassword('TestService', 'TestAccount');
       console.log('Retrieved password:', password);
     } catch (error) {
       console.error('Keytar test failed:', error);
     }
   }

   testKeytar();
    ```

2. Run the script:
    ```bash
node test-keytar.js
    ```

Expected output:
    ```
Password set successfully
Retrieved password: TestPassword
    ```

If you encounter errors, ensure that the GNOME keyring daemon is running and properly configured.

## Step 5: Troubleshooting

If you encounter issues, try the following steps:

1. Restart the GNOME keyring daemon with debug output:
    ```bash
   killall gnome-keyring-daemon
   gnome-keyring-daemon --start --components=secrets --foreground --debug
    ```

2. Check D-Bus connection to the secret service:
    ```bash
   gdbus call --session --dest org.freedesktop.secrets --object-path /org/freedesktop/secrets --method org.freedesktop.DBus.Peer.Ping
    ```

3. Verify the secret service is listed in D-Bus services:
    ```bash
   dbus-send --session --dest=org.freedesktop.DBus --type=method_call --print-reply /org/freedesktop/DBus org.freedesktop.DBus.ListNames
    ```

4. Test secret storage using command-line tools:
    ```bash
   secret-tool store --label="Test Secret" service TestService account TestAccount
   secret-tool lookup service TestService account TestAccount
    ```