from beaker import *
from pyteal import *

class MintAppState:
    # Global state value to store a general message or text
    global_message = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("GlobalMessage"),
        default=Bytes(""),
        descr="Stores a general global message as text"
    )

    # Total supply of the TESLA coin
    total_supply = GlobalStateValue(
        stack_type=TealType.uint64,
        key=Bytes("TotalSupply"),
        default=Int(0),
        descr="Total supply of TESLA coins"
    )

    # Address of the contract creator
    creator_address = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("CreatorAddress"),
        descr="Address of the contract creator"
    )

    # Flag to indicate if the asset has been created
    is_asset_created = GlobalStateValue(
        stack_type=TealType.uint64,
        key=Bytes("AssetCreated"),
        default=Int(0),
        descr="Flag indicating whether the asset is created"
    )

    # Address holding the contract
    holding_contract_address = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("HoldingContractAddress"),
        descr="Address of the contract holding the asset"
    )

    # Address used for burning coins
    burn_address = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("BurnAddress"),
        descr="Address designated for burning coins"
    )

    # Initializes the application by setting the creator and global text
    @external(authorize=Authorize.only(Global.creator_address()))
    def initialize(self, global_message: abi.String):
        return Seq(
            self.global_message.set(global_message.get()),
            self.creator_address.set(Txn.sender()),
            Approve()
        )

    # Minting function to increase the total supply
    @external(authorize=Authorize.only(Global.creator_address()))
    def mint(self, amount: abi.Uint64):
        return Seq(
            self.total_supply.set(self.total_supply.get() + amount.get()),
            Approve()
        )

    # Function to burn coins, reducing the total supply
    @external(authorize=Authorize.only(Global.creator_address()))
    def burn(self, amount: abi.Uint64):
        return Seq(
            Assert(self.total_supply.get() >= amount.get()),  # Ensure sufficient supply to burn
            self.total_supply.set(self.total_supply.get() - amount.get()),
            Approve()
        )

    # Function to update the holding contract address
    @external(authorize=Authorize.only(Global.creator_address()))
    def update_holding_address(self, address: abi.Address):
        return Seq(
            self.holding_contract_address.set(address.get()),
            Approve()
        )

    # Function to update the burn address
    @external(authorize=Authorize.only(Global.creator_address()))
    def update_burn_address(self, address: abi.Address):
        return Seq(
            self.burn_address.set(address.get()),
            Approve()
        )
