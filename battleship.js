var readlineSync = require('readline-sync');
var underscore = require('underscore');

var SHIPS = [
    {name: 'carrier', size: 5},
    {name: 'battleship', size: 4},
    {name: 'cruiser', size: 3},
    {name: 'submarine', size: 3},
    {name: 'destroyer', size: 2},
];

function Battleship() {
    var computerBoard = {};
    var playerBoard = {};

    this.startGame = function() {
        console.log('Welcome to battleship!');

        // initialize boards
        initializeBoard(computerBoard);
        initializeBoard(playerBoard);

        // set up boards
        setUpRandomBoard(computerBoard);
        setUpPlayerBoard();

        // start turns
        while (true) {
            printGameState();
            playerTurn();
            printGameState();
            computerTurn();
        }
    };

    this.generateShipDistribution = function() {
        var NUM_OF_BOARDS = 100000;
        var distributionVector = [];

        for (var i = 0; i < NUM_OF_BOARDS; i++) {
            var randomBoard = {
                map: []
            };

            setUpRandomBoard(randomBoard);
            var flattenedMap = flattenMap(randomBoard.map);

            // add to distribution vector
            for (var j = 0; j < flattenedMap.length; j++) {
                if (flattenedMap[j]) {
                    if (distributionVector[j]) {
                        distributionVector[j]++;
                    } else {
                        distributionVector[j] = 1;
                    }
                }
            }
        }

        var expandedDistribution = distributionVector.map(function(occurrenceCount, i) {
            return [i, occurrenceCount];
        });

        // sort by occurrence counts (high to low) while preserving indeces
        expandedDistribution.sort(function(a, b) {
            return b[1] - a[1];
        });

        // [[originalIndex, occurrenceCount], ...]
        return expandedDistribution;
    };

    function indexOfMax(array) {
        var maxIndex;
        var maxVal = -1;

        for (var i = 0; i < array.length; i++) {
            if (array[i] > maxVal) {
                maxIndex = i;
                maxVal = array[i];
            }
        }

        return maxIndex;
    }

    function initializeBoard(board) {
        board.livingShips = 5;
        board.map = [];

        SHIPS.forEach(function(ship) {
            board[ship.name] = {
                size: ship.size,
                hits: 0
            };
        });
    }

    function setUpPlayerBoard() {
        console.log('For each ship, choose a starting index for the edge of the ship and an orientation');

        SHIPS.forEach(function(ship) {
            printGameState();

            // input index + check validity
            process.stdout.write('The next ship is ');
            process.stdout.write(ship.size.toString());
            process.stdout.write(' space long.\n');

            var coords = readlineSync.question('Where would you like to insert it? [A-J],[1-10] (ex: "B,10")', {hideEchoBack: false});
            // TODO: Check validity - regex?
            var yxCoords = parseCoords(coords);
            var validOrientations = getValidOrientations(playerBoard.map, yxCoords, ship.size);
            // TODO: Check validity - use while loop? (validOrientations.length !== 0)
            
            var orientationIndex = readlineSync.keyInSelect(validOrientations, 'Orientation? (just press number of selection)', {cancel: false});
            var orientation = validOrientations[orientationIndex];

            // insert ship
            insertShip(playerBoard.map, yxCoords, orientation, ship);
        });
    }

    function setUpRandomBoard(board) {
        SHIPS.forEach(function(ship) {
            var validOrientations = [];
            var randomCoords;

            while (validOrientations.length === 0) {
                randomCoords = generateRandomCoords();
                validOrientations = getValidOrientations(board.map, randomCoords, ship.size);
            }

            var randomOrientationIndex = Math.floor(Math.random() * validOrientations.length);
            var randomOrientation = validOrientations[randomOrientationIndex];

            insertShip(board.map, randomCoords, randomOrientation, ship);
        });
    }

    function generateRandomCoords() {
        // generates random number [0,9]
        var randomXCoord = Math.floor(Math.random() * 10);
        var randomYCoord = Math.floor(Math.random() * 10);

        return [randomYCoord, randomXCoord];
    }

    function printGameState() {
        // print map of computer board
        // TODO: Don't print ships, just markers
        printBoard(computerBoard);

        // print map of player board
        printBoard(playerBoard);
    }

    function printBoard(board) {
        console.log('  1 2 3 4 5 6 7 8 9 10');
        for (var i = 0; i < 10; i++) {
            process.stdout.write(String.fromCharCode(i + 65) + ' ');
            if (typeof board.map[i] !== 'undefined') {
                for (var j = 0; j < 10; j++) {
                    if (typeof board.map[i][j] === 'undefined') {
                        process.stdout.write('- ');
                    } else {
                        // H, M, or -
                        process.stdout.write(board.map[i][j].representation + ' ');
                    }
                }
            } else {
                // print empty row
                process.stdout.write('- - - - - - - - - -');
            }
            process.stdout.write('\n');
        }
    }

    function getValidOrientations(map, yxCoords, shipSize) {
        // return [] if coord pair is already occupied
        if (map[yxCoords[0]] && map[yxCoords[0]][yxCoords[1]]) {
            return [];
        }

        // check for valid orientations
        var validOrientations = ['left', 'up', 'right', 'down'];

        validOrientations = validOrientations.filter(function(orientation) {
            var i;

            switch (orientation) {
                case 'left':
                    if (yxCoords[1] - shipSize + 1 < 0) {
                        return false;
                    }

                    for (i = 0; i < shipSize; i++) {
                        if (map[yxCoords[0]] && map[yxCoords[0]][yxCoords[1] - i]) {
                            return false;
                        }
                    }

                    return true;
                case 'up':
                    if (yxCoords[0] - shipSize + 1 < 0) {
                        return false;
                    }

                    for (i = 0; i < shipSize; i++) {
                        if (map[yxCoords[0] - i] && map[yxCoords[0] - i][yxCoords[1]]) {
                            return false;
                        }
                    }

                    return true;
                case 'right':
                    if (yxCoords[1] + shipSize > 10) {
                        return false;
                    }

                    for (i = 0; i < shipSize; i++) {
                        if (map[yxCoords[0]] && map[yxCoords[0]][yxCoords[1] + i]) {
                            return false;
                        }
                    }

                    return true;
                case 'down':
                    if (yxCoords[0] + shipSize > 10) {
                        return false;
                    }

                    for (i = 0; i < shipSize; i++) {
                        if (map[yxCoords[0] + i] && map[yxCoords[0] + i][yxCoords[1]]) {
                            return false;
                        }
                    }

                    return true;
            }
        });

        return validOrientations;
    }

    function insertShip(map, coords, orientation, ship) {
        var i;
        switch (orientation) {
            case 'left':
                // define row if undefined
                if (!map[coords[0]]) {
                    map[coords[0]] = [];
                }

                for (i = 0; i < ship.size; i++) {
                    map[coords[0]][coords[1] - i] = {
                        shipType: ship.name,
                        representation: '*'
                    };
                }
                break;
            case 'up':
                for (i = 0; i < ship.size; i++) {
                    // define row if undefined
                    if (!map[coords[0] - i]) {
                        map[coords[0] - i] = [];
                    }

                    map[coords[0] - i][coords[1]] = {
                        shipType: ship.name,
                        representation: '*'
                    };
                }
                break;
            case 'right':
                // define row if undefined
                if (!map[coords[0]]) {
                    map[coords[0]] = [];
                }

                for (i = 0; i < ship.size; i++) {
                    map[coords[0]][coords[1] + i] = {
                        shipType: ship.name,
                        representation: '*'
                    };
                }
                break;
            case 'down':
                for (i = 0; i < ship.size; i++) {
                    // define row if undefined
                    if (!map[coords[0] + i]) {
                        map[coords[0] + i] = [];
                    }

                    map[coords[0] + i][coords[1]] = {
                        shipType: ship.name,
                        representation: '*'
                    };
                }
        }
    }

    function playerTurn() {
        var coords;
        var yxCoords;

        while(!validTargetCoords(computerBoard.map, yxCoords)) {
            coords = readlineSync.question('Where would you like to shoot? [A-J],[1-10] (ex: "B,10")', {hideEchoBack: false});
            yxCoords = parseCoords(coords);
        }

        markShot(computerBoard, yxCoords);
    }

    function computerTurn() {
        var randomCoords;

        while(!validTargetCoords(playerBoard.map, randomCoords)) {
            randomCoords = generateRandomCoords();
        }

        markShot(playerBoard, randomCoords);
    }

    function validTargetCoords(map, yxCoords) {
        if (typeof yxCoords === 'undefined') {
            return false;
        }

        if (map[yxCoords[0]] &&
            map[yxCoords[0]][yxCoords[1]] &&
            (map[yxCoords[0]][yxCoords[1]].representation === 'h' || map[yxCoords[0]][yxCoords[1]].representation === 'm')) {
                return false;
            }

            return true;
    }

    function markShot(board, yxCoords) {
        var map = board.map;

        if (typeof map[yxCoords[0]] === 'undefined') {
            console.log('shot missed!');

            map[yxCoords[0]] = [];
            map[yxCoords[0]][yxCoords[1]] = {
                representation: 'm'
            };
        } else {
            if (typeof map[yxCoords[0]][yxCoords[1]] === 'undefined') {
                console.log('shot missed!');

                map[yxCoords[0]][yxCoords[1]] = {
                    representation: 'm'
                };
            } else {
                console.log('shot hit!');

                map[yxCoords[0]][yxCoords[1]].representation = 'h';
                var shipType = map[yxCoords[0]][yxCoords[1]].shipType;
                board[shipType].hits++;

                if (board[shipType].hits === board[shipType].size) {
                    console.log('battleship sunk!');
                    board.livingShips--;

                    if (board.livingShips === 0) {
                        console.log('Game over!');
                        process.exit();
                    }
                }
            }
        }
    }

    // converts coords like "B,10" to [1,9]
    function parseCoords(coords) {
        var yVal = coords.charCodeAt(0) - 65; // convert from ascii char val to index
        var xVal = parseInt(coords.split(',')[1]) - 1;

        return [yVal, xVal];
    }

    function flattenMap(map) {
        var flattenedMap = [];

        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 10; j++) {
                if (map[i] && map[i][j]) {
                    // mark flattenedMap
                    flattenedMap[i*10 + j] = 1;
                }
            }
        }

        return flattenedMap;
    }
}

var battleship = new Battleship();
battleship.startGame();

// Generate distribution:
// var dist = battleship.generateShipDistribution();
// console.log(dist);
