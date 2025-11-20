---
description: Deploy LittleBrickOut to GitHub Pages
---

This workflow will guide you through the process of deploying your game to GitHub Pages.

1.  **Initialize Git Repository**
    We need to turn your project into a Git repository.
    // turbo
    ```bash
    git init
    git add .
    git commit -m "Initial commit: LittleBrickOut game"
    ```

2.  **Create a Repository on GitHub**
    - Go to [GitHub.com](https://github.com) and sign in.
    - Click the "+" icon in the top right and select "New repository".
    - Name it `LittleBrickOut` (or whatever you prefer).
    - Make it **Public**.
    - Click "Create repository".

3.  **Push to GitHub**
    Copy the commands from the "...or push an existing repository from the command line" section on GitHub. They will look like this (replace `YOUR_USERNAME` with your actual username):

    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/LittleBrickOut.git
    git branch -M main
    git push -u origin main
    ```
    Run these commands in your terminal.

4.  **Enable GitHub Pages**
    - Go to the **Settings** tab of your new repository on GitHub.
    - Click on **Pages** in the left sidebar.
    - Under **Build and deployment** > **Source**, select **Deploy from a branch**.
    - Under **Branch**, select `main` and `/ (root)`.
    - Click **Save**.

5.  **Play!**
    - Wait a minute or two.
    - Refresh the Pages settings page.
    - You will see a link at the top (e.g., `https://YOUR_USERNAME.github.io/LittleBrickOut/`).
    - Click it to play your game online!
