const yargs = require('yargs');
const main = require('../');
const exitOnError = require('../utils/exit-on-error');
const chalk = require('chalk');

let registeredCommands = [];
let registeredCommandObjs = [];

function registerCommand(cmd) {
    registeredCommandObjs.push(cmd);
    if (Object.prototype.hasOwnProperty.call(cmd, 'command')) {
        // remove […] and <…> and trim, leaving only the command (ex: 'state')
        // check for aliases
        const cleanCommand = (cmd) => cmd.replace(/\s*\[.*\]/gi, '').replace(/\s*<.*>/gi, '').trim();
        if (Array.isArray(cmd.command)) {
            for (const alias of cmd.command) {
                console.log('findthis', alias);
                registeredCommands.push(cleanCommand(alias));
            }
        } else {
            registeredCommands.push(cleanCommand(cmd.command));
        }
    }
}

// For account:
const login = {
    command: 'login',
    desc: 'logging in through NEAR protocol wallet',
    builder: (yargs) => yargs
        .option('walletUrl', {
            desc: 'URL of wallet to use',
            type: 'string',
            required: false
        }),
    handler: exitOnError(main.login)
};
registerCommand(login);

const viewAccount = {
    command: 'state <accountId>',
    desc: 'view account state',
    builder: (yargs) => yargs
        .option('accountId', {
            desc: 'Account to view',
            type: 'string',
            required: true
        }),
    handler: exitOnError(main.viewAccount)
};
registerCommand(viewAccount);

const deleteAccount = {
    command: 'delete <accountId> <beneficiaryId>',
    desc: 'delete an account and transfer funds to beneficiary account.',
    builder: (yargs) => yargs
        .option('accountId', {
            desc: 'Account to view',
            type: 'string',
            required: true
        })
        .option('beneficiaryId', {
            desc: 'Account to transfer funds to',
            type: 'string',
            required: true
        }),
    handler: exitOnError(main.deleteAccount)
};
registerCommand(deleteAccount);

const keys = {
    command: 'keys <accountId>',
    desc: 'view account public keys',
    builder: (yargs) => yargs
        .option('accountId', {
            desc: 'Account to view',
            type: 'string',
            required: true
        }),
    handler: exitOnError(main.keys)
};
registerCommand(keys);

const sendMoney = {
    command: 'send <sender> <receiver> <amount>',
    desc: 'send tokens to given receiver',
    builder: (yargs) => yargs
        .option('amount', {
            desc: 'Amount of NEAR tokens to send',
            type: 'string',
        }),
    handler: exitOnError(main.sendMoney)
};
registerCommand(sendMoney);

const stake = {
    command: 'stake [accountId] [stakingKey] [amount]',
    desc: 'create staking transaction',
    builder: (yargs) => yargs
        .option('accountId', {
            desc: 'Account to stake on',
            type: 'string',
            required: true,
        })
        .option('stakingKey', {
            desc: 'Public key to stake with (base58 encoded)',
            type: 'string',
            required: true,
        })
        .option('amount', {
            desc: 'Amount to stake',
            type: 'string',
            required: true,
        }),
    handler: exitOnError(main.stake)
};
registerCommand(stake);

// For contract:
const deploy = {
    command: 'deploy',
    desc: 'deploy your smart contract',
    builder: (yargs) => yargs
        .option('wasmFile', {
            desc: 'Path to wasm file to deploy',
            type: 'string',
            default: './out/main.wasm'
        })
        .alias({
            'accountId': ['account_id', 'contractName', 'contract_name'],
        }),
    handler: exitOnError(main.deploy)
};
registerCommand(deploy);

const callViewFunction = {
    command: 'view [contractName] [methodName] [data] [gas] [amount]',
    desc: 'make smart contract call which can view state',
    builder: (yargs) => yargs
        .option('contractName', {
            desc: 'Contract where the method is being called',
            type: 'string',
        })    
        .option('methodName', {
            desc: 'Contract method being called',
            type: 'string',
        })
        .option('data', {
            desc: 'Data to send to method',
            type: 'string',
        })
        .option('gas', {
            desc: 'Max amount of gas this call can use',
            type: 'string',
            default: '100000000000000'
        })
        .option('amount', {
            desc: 'Number of tokens to attach',
            type: 'string',
            default: '0'
        }),        
    handler: exitOnError(main.callViewFunction)
};
registerCommand(callViewFunction);

const { spawn } = require('child_process');
const build = {
    command: 'build',
    desc: 'build your smart contract',
    handler: () => {
        const gulp = spawn('gulp', [], {shell: process.platform == 'win32'});
        gulp.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        gulp.stderr.on('data', function (data) {
            console.log(data.toString());
        });
        gulp.on('exit', function (code) {
            process.exit(code);
        });
    }
};
registerCommand(build);

const clean = {
    command: 'clean',
    desc: 'clean the build environment',
    builder: (yargs) => yargs
        .option('outDir', {
            desc: 'build directory',
            type: 'string',
            default: './out'
        }),
    handler: exitOnError(main.clean)
};
registerCommand(clean);

const defaultCommand = {
    command: '$0',
};
registerCommand(defaultCommand);

// middleware to validate commands and arguments
const checkCommandsArgs = (argv, yargsInstance) => {
    main.checkCommandsArgs(argv, yargsInstance, registeredCommandObjs, registeredCommands);
};

// add external commands
const createAccountCommand = require('../commands/create-account');
registerCommand(createAccountCommand);
const txStatusCommand = require('../commands/tx-status');
registerCommand(txStatusCommand);
const devDeployCommand = require('../commands/dev-deploy');
registerCommand(devDeployCommand);
const callCommand = require('../commands/call');
registerCommand(callCommand);
const replCommand = require('../commands/repl');
registerCommand(replCommand);
const generateKeyCommand = require('../commands/generate-key');
registerCommand(generateKeyCommand);

let config = require('../get-config')();
yargs // eslint-disable-line
    .middleware([require('../utils/check-version'), checkCommandsArgs])
    .scriptName('near')
    .option('nodeUrl', {
        desc: 'NEAR node URL',
        type: 'string',
        default: 'http://localhost:3030'
    })
    .option('networkId', {
        desc: 'NEAR network ID, allows using different keys based on network',
        type: 'string',
        default: 'default'
    })
    .option('helperUrl', {
        desc: 'NEAR contract helper URL',
        type: 'string',
    })
    .option('keyPath', {
        desc: 'Path to master account key',
        type: 'string',
    })
    .option('accountId', {
        desc: 'Unique identifier for the account',
        type: 'string',
    })
    .option('masterAccount', {
        desc: 'Master account used when create new accounts',
        type: 'string',
        hidden: true
    })
    .middleware(require('../middleware/key-store'))
    .middleware(require('../middleware/print-options'));

for (const command of registeredCommandObjs) {
    yargs.command(command);
}

yargs
    .config(config)
    .alias({
        'accountId': ['account_id'],
        'nodeUrl': 'node_url',
        'networkId': ['network_id'],
        'wasmFile': 'wasm_file',
        'projectDir': 'project_dir',
        'outDir': 'out_dir'
    })
    .showHelpOnFail(true)
    .demandCommand(1, chalk`Pass {bold --help} to see all available commands and options.`)
    .usage(chalk`Usage: {bold $0 <command> [options]}`)
    .epilogue(chalk`Check out our epic whiteboard series: {bold http://near.ai/wbs}`)
    .wrap(null)
    .fail(function (msg) {
        console.error(`Error: ${msg}\nPlease use the --help flag for more information.`);
        yargs.exit();
    })
    .argv;