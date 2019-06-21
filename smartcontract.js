let web3;
let demoscratos;

let abi;

abi = `[
{
"constant": false,
"inputs": [
{
"name": "proposal",
"type": "uint256"
}
],
"name": "vote",
"outputs": [
{
"name": "",
"type": "uint256"
}
],
"payable": false,
"stateMutability": "nonpayable",
"type": "function"
},
{
"constant": true,
"inputs": [
{
"name": "",
"type": "uint256"
}
],
"name": "proposals",
"outputs": [
{
"name": "name",
"type": "bytes32"
},
{
"name": "voteCount",
"type": "uint256"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [
{
"name": "i",
"type": "uint256"
}
],
"name": "getProposalVoteCount",
"outputs": [
{
"name": "",
"type": "uint256"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [],
"name": "chairperson",
"outputs": [
{
"name": "",
"type": "address"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [
{
"name": "",
"type": "uint256"
}
],
"name": "votersAddress",
"outputs": [
{
"name": "",
"type": "address"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [],
"name": "getProposalNames",
"outputs": [
{
"name": "",
"type": "bytes32[]"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": false,
"inputs": [
{
"name": "vs",
"type": "address[]"
}
],
"name": "giveRightToVote",
"outputs": [],
"payable": false,
"stateMutability": "nonpayable",
"type": "function"
},
{
"constant": true,
"inputs": [],
"name": "votedFor",
"outputs": [
{
"name": "",
"type": "bytes32"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [
{
"name": "",
"type": "address"
}
],
"name": "voters",
"outputs": [
{
"name": "weight",
"type": "uint256"
},
{
"name": "voted",
"type": "bool"
},
{
"name": "vote",
"type": "uint256"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [],
"name": "getVoters",
"outputs": [
{
"name": "",
"type": "address[]"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"constant": true,
"inputs": [
{
"name": "",
"type": "uint256"
}
],
"name": "proposalNames",
"outputs": [
{
"name": "",
"type": "bytes32"
}
],
"payable": false,
"stateMutability": "view",
"type": "function"
},
{
"inputs": [
{
"name": "pNames",
"type": "bytes32[]"
}
],
"payable": false,
"stateMutability": "nonpayable",
"type": "constructor"
}
]`


function checkContract() {
  let confForm = document.forms['conf-form'];
  let address = confForm['network-address'].value || '127.0.0.1:8545';
  let contractAddress = confForm['contract-address'].value;

  web3 = new Web3(new Web3.providers.HttpProvider(address));

  if (!web3.utils.isAddress(contractAddress)) {
    document.getElementById('error-config').innerHTML = `Adresse ${contractAddress} invalide`;
    return;
  }

  web3.eth.getCode(contractAddress).then(res => {
    if (res == '0x') {
      document.getElementById('error-config').innerHTML = `Contrat intelligent introuvable à l'adresse ${contractAddress}`;
      return;
    }

    web3.eth.getAccounts().then(accounts => {
      let accountsSelect = document.forms['account']['accounts'];

      demoscratos = new web3.eth.Contract(JSON.parse(abi), contractAddress);

      web3.eth.defaultAccount = accounts[0];

      demoscratos.methods.getVoters().call().then(voters => {
        for (let voter of voters) {
          let opt = document.createElement('option');
          opt.text = voter;
          opt.value = voter;
          accountsSelect.appendChild(opt);
        }
        showStep(2);
      });
    }, err => {
      document.getElementById('error-config').innerHTML = `Réseau Ethereum <strong>${address}</strong> introuvable`;
    });
  });

}

function showStep(index) {
  for (let d of document.querySelectorAll('.step')) {
    d.style.display = 'none';
  }

  document.querySelector(`.step.s-${index}`).style.display = 'block';
}

function refreshTable() {
  let candidatesTable = document.getElementById('candidates');

  let hRow = document.createElement('tr');
  let actHCol = document.createElement('th');
  let candHCol = document.createElement('th');
  let totHCol = document.createElement('th');

  actHCol.innerHTML = 'Action';
  candHCol.innerHTML = 'Candidats';
  totHCol.innerHTML = 'Total de vote';

  hRow.appendChild(actHCol);
  hRow.appendChild(candHCol);
  hRow.appendChild(totHCol);

  candidatesTable.innerHTML = '';
  candidatesTable.appendChild(hRow);

  document.getElementById('connected-as').innerHTML = `<span class="example">Connecté avec l'adresse <strong>${web3.eth.defaultAccount}<strong></span>`;

  demoscratos.methods.votedFor().call({ from: web3.eth.defaultAccount }).then(votedFor => {
    demoscratos.methods.getProposalNames().call().then(propNames => {
      for (let [index, proposal] of propNames.entries()) {
        let row = document.createElement('tr');

        let cNameCol = document.createElement('td');
        let voteCountCol = document.createElement('td');
        let actCol = document.createElement('td');

        cNameCol.innerHTML = web3.utils.hexToAscii(proposal);
        demoscratos.methods.getProposalVoteCount(index).call().then(nbVote => {
          voteCountCol.innerHTML = `<span>${nbVote}</span>`;
        });

        if (votedFor == 0x0) {
          let actBtn = _createActButton();
          actBtn.setAttribute('onclick', `voteFor(${index})`);
          actCol.appendChild(actBtn);
        } else if (votedFor === proposal) {
          actCol.innerHTML = '<span>A voté</span>';
        }

        row.appendChild(actCol);
        row.appendChild(cNameCol);
        row.appendChild(voteCountCol);
        candidatesTable.appendChild(row);
      }
    });
  });
}

function voteFor(proposalIndex) {
  demoscratos.methods.vote(+proposalIndex).send({ from: web3.eth.defaultAccount }).then(res => {
    refreshTable();
  }, err => {
    document.getElementById('error-vote').innerHTML = 'Le vote a échoué';
  });
}

function unlockAccount() {
  let form = document.forms['account'];
  let accountAddress = form['accounts'].value;
  let password = form['acc-password'].value;
  web3.eth.personal.unlockAccount(accountAddress, password, function (error, valid) {
    if (!valid) {
      document.getElementById('error-connect').innerHTML = 'Mot de passe invalide';
      return;
    }

    web3.eth.defaultAccount = accountAddress;
    refreshTable();

    showStep(3);
  });
}

function _createActButton() {
  let actBtn = document.createElement('button');
  actBtn.setAttribute('class', 'btn');
  actBtn.innerHTML = '<span>Voter</span>';
  return actBtn;
}
