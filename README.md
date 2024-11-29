Pulley-Puzzle/
│
├── index.html
│
├── js/
│   ├── main.js
│   ├── webgl-utils.js
│   ├── menu.js
│   ├── background.js
│   ├── camera.js           # Camera manipulation
│   ├── object-manager.js   # Object creation and manipulation
│   ├── level-manager.js    # Level design and progression
│   ├── score-manager.js    # Scoring system
│   └── physics.js          # Pulley physics simulation
│
├── shaders/
│   ├── vertex/
│   │   ├── home-menu-vertex.glsl
│   │   ├── background-vertex.glsl
│   │   ├── object-vertex.glsl
│   │   └── pulley-vertex.glsl
│   └── fragment/
│       ├── home-menu-fragment.glsl
│       ├── background-fragment.glsl
│       ├── object-fragment.glsl
│       └── pulley-fragment.glsl
│
├── css/
│   └── styles.css
│
└── assets/
    ├── levels/
    │   └── level-configs.json
    └── models/
        └── pulley-models.json
