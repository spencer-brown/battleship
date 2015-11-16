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
    var rl;

    this.startGame = function() {
        console.log('Welcome to battleship!');

        // initialize boards
        initializeBoard(computerBoard);
        initializeBoard(playerBoard);

        // set up board
        setUpComputerBoard();
        setUpPlayerBoard();

        printGameState();
        // start turns
    };

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
            var yxCoords = parseCoords(coords);
            var validOrientations = getValidOrientations(playerBoard.map, yxCoords, ship.size);
            // TODO: Check validity - use while loop? (validOrientations.length !== 0)
            
            var orientationIndex = readlineSync.keyInSelect(validOrientations, 'Orientation? (just press number of selection)', {cancel: false});
            var orientation = validOrientations[orientationIndex];

            // insert ship
            insertShip(playerBoard.map, yxCoords, orientation, ship);
        });
    }

    function setUpComputerBoard() {
        SHIPS.forEach(function(ship) {
            var validOrientations = [];
            var randomCoords;

            while (validOrientations.length === 0) {
                randomCoords = generateRandomCoords();
                validOrientations = getValidOrientations(computerBoard.map, randomCoords, ship.size);
            }

            var randomOrientationIndex = Math.floor(Math.random() * validOrientations.length);
            var randomOrientation = validOrientations[randomOrientationIndex];

            insertShip(computerBoard.map, randomCoords, randomOrientation, ship);
        });
    }

    function generateRandomCoords() {
        // generates random number [0,9]
        var randomXCoord = Math.floor(Math.random() * 10);
        var randomYCoord = Math.floor(Math.random() * 10);

        return [randomYCoord, randomXCoord];
    }

    function printGameState() {
        // TODO: print map of computer board

        // print map of player board
        console.log('  1 2 3 4 5 6 7 8 9 10');
        for (var i = 0; i < 10; i++) {
            process.stdout.write(String.fromCharCode(i + 65) + ' ');
            if (typeof playerBoard.map[i] !== 'undefined') {
                for (var j = 0; j < 10; j++) {
                    if (typeof playerBoard.map[i][j] === 'undefined') {
                        process.stdout.write('- ');
                    } else {
                        // H, M, or -
                        process.stdout.write(playerBoard.map[i][j].representation + ' ');
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

    // converts coords like "B,10" to [1,9]
    function parseCoords(coords) {
        var yVal = coords.charCodeAt(0) - 65; // convert from ascii char val to index
        var xVal = parseInt(coords.split(',')[1]) - 1;

        return [yVal, xVal];
    }
}

var battleship = new Battleship();
battleship.startGame();
