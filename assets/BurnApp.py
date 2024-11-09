from beaker import *
from pyteal import *

class BurnAppState:
    # Global state to store a general message or text
    global_message = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("GlobalMessage"),
        default=Bytes(""),
        descr="Stores a general global message"
    )

    # Asset ID of the TESLA coin to be burned
    asset_id = GlobalStateValue(
        stack_type=TealType.uint64,
        key=Bytes("AssetID"),
        descr="Asset ID of TESLA coins to burn"
    )

    # Address of the contract creator
    creator_address = GlobalStateValue(
        stack_type=TealType.bytes,
        key=Bytes("CreatorAddress"),
        descr="Address of the contract creator"
    )

# Application name and initialization
APP_NAME = "BurnApp"
app = Application(APP_NAME, state=BurnAppState())

# Application creation method
@app.create
def create(asset_id: abi.Uint64) -> Expr:
    """Initialize the contract by setting the creator and asset ID."""
    return Seq(
        app.state.creator_address.set(Txn.sender()), 
        app.state.asset_id.set(asset_id.get())
    )

# External method for the contract creator to opt into the asset
@app.external
def asset_opt_in() -> Expr:
    """Allows the creator to opt into the asset before burning."""
    return Seq(
        Assert(Txn.sender() == app.state.creator_address.get()), 
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: app.state.asset_id.get(),
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.asset_amount: Int(0)
        }),
        Approve()
    )

# Method to burn a specified amount of the asset
@app.external
def burn_asset(amount: abi.Uint64) -> Expr:
    """Burn a specified amount of the TESLA asset."""
    return Seq(
        Assert(Txn.sender() == app.state.creator_address.get()),
        InnerTxnBuilder.Execute({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: app.state.asset_id.get(),
            TxnField.asset_receiver: Global.zero_address(),
            TxnField.asset_amount: amount.get()
        }),
        Approve()
    )
