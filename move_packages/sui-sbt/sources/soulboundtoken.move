module sbt::soulboundtoken {
    use std::string::{String, utf8};
    use std::vector;
    use sui::object::{Self, ID, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::vec_set::{Self, VecSet};
    use sui::transfer;
    use sui::table::{Self, Table};
    #[test_only]
    use sui::test_scenario;

    const ESENDER_NOT_AUTHORIZED_TO_CLAIM: u64 = 0;
    const EMEDAL_MAX_AMOUNT_REACHED: u64 = 1;
    const EALREADY_CLAIMED: u64 = 2;

    struct CollectionStore has key, store {
        id: UID,
        nfts: Table<u64, ID>
    }

    struct CollectionSchema has key, store {
        id: UID,
        name: String,
        description: String,
        url: String,
        max_amount: u64,
        whitelist: VecSet<address>,
        owners: Table<address, bool>,
        creator: address,
    }

    struct SoulboundTokenSchema has key {
        id: UID,
        name: String,
        description: String,
        url: String,
        medal: ID,
    }

    fun init(ctx: &mut TxContext) {
        create_collection(ctx)
    }

    fun create_collection(
        ctx: &mut TxContext,
    ) {
        let store = CollectionStore {
            id: object::new(ctx),
            nfts: table::new(ctx),
        };
        transfer::share_object(store)
    }

    public entry fun create_soulbound_token(
        medal_store: &mut CollectionStore,
        name: vector<u8>,
        description: vector<u8>,
        max_amount: u64,
        whitelist: vector<address>,
        url: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let collection = CollectionSchema {
            id: object::new(ctx),
            name: utf8(name),
            description: utf8(description),
            url: utf8(url),
            max_amount,
            whitelist: vec_set::empty(),
            owners: table::new(ctx),
            creator: tx_context::sender(ctx),
        };
        let len = vector::length(&whitelist);
        let i = 0;
        while (i < len) {
            vec_set::insert(&mut collection.whitelist, *vector::borrow(&whitelist, i));
            i = i + 1;
        };
        let medal_key = table::length(&medal_store.nfts);
        table::add(&mut medal_store.nfts, medal_key, object::uid_to_inner(&collection.id));
        transfer::share_object(collection);
    }

    /**
    * Mint a soulbound token to a specific address
    * @param collection: CollectionSchema
    * @param mint_addr: address
    * @param ctx
    */
    public entry fun mint_soulbound_token(
        collection: &mut CollectionSchema,
        mint_addrs: vector<address>,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == collection.creator, ESENDER_NOT_AUTHORIZED_TO_CLAIM);
        let userLength = vector::length(&mint_addrs);
        let i = 0;
        while (i < userLength) {
            let mint_addr = *vector::borrow(&mint_addrs, i);
            assert!(table::length(&collection.owners) < collection.max_amount, EMEDAL_MAX_AMOUNT_REACHED);
            assert!(!table::contains(&collection.owners, mint_addr), EALREADY_CLAIMED);
            table::add(&mut collection.owners, mint_addr, true);
            let user_sbt = SoulboundTokenSchema {
                id: object::new(ctx),
                medal: object::uid_to_inner(&collection.id),
                name: collection.name,
                description: collection.description,
                url: collection.url,
            };
            transfer::transfer(user_sbt, mint_addr);
            i = i + 1;
        };
    }

    public entry fun claim_soulbound_token(
        medal: &mut CollectionSchema,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            vec_set::is_empty(&medal.whitelist) || vec_set::contains(&medal.whitelist, &sender),
            ESENDER_NOT_AUTHORIZED_TO_CLAIM
        );
        assert!(table::length(&medal.owners) < medal.max_amount, EMEDAL_MAX_AMOUNT_REACHED);
        assert!(!table::contains(&medal.owners, sender), EALREADY_CLAIMED);
        table::add(&mut medal.owners, sender, true);
        let personal_medal = SoulboundTokenSchema {
            id: object::new(ctx),
            medal: object::uid_to_inner(&medal.id),
            name: medal.name,
            description: medal.description,
            url: medal.url,
        };
        transfer::transfer(personal_medal, sender);
    }

    #[test]
    fun test_medal() {
        let admin = @0xFACE;
        let publisher = @0xCAFE;
        let user = @0xBABE;

        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        test_scenario::next_tx(scenario, admin);
        {
            create_collection(test_scenario::ctx(scenario));
        };
        test_scenario::next_tx(scenario, publisher);
        {
            let medal_store = test_scenario::take_shared<CollectionStore>(scenario);
            assert!(table::is_empty(&medal_store.nfts), 0);

            create_soulbound_token(
                &mut medal_store,
                b"medal name",
                b"medal description",
                100,
                vector::empty<address>(),
                b"logo",
                test_scenario::ctx(scenario),
            );

            assert!(table::length(&medal_store.nfts) == 1, 0);
            test_scenario::return_shared(medal_store);
        };
        test_scenario::next_tx(scenario, user);
        {
            let medal = test_scenario::take_shared<CollectionSchema>(scenario);
            assert!(table::length(&medal.owners) == 0, 0);

            claim_soulbound_token(&mut medal, test_scenario::ctx(scenario));

            assert!(table::length(&medal.owners) == 1, 0);
            assert!(table::contains(&medal.owners, user), 0);
            test_scenario::return_shared(medal);
        };
        test_scenario::next_tx(scenario, user);
        {
            let medal_store = test_scenario::take_shared<CollectionStore>(scenario);
            let medal = test_scenario::take_shared<CollectionSchema>(scenario);
            let personal_medal = test_scenario::take_from_sender<SoulboundTokenSchema>(scenario);
            assert!(personal_medal.medal == object::uid_to_inner(&medal.id), 0);
            test_scenario::return_shared(medal);
            test_scenario::return_shared(medal_store);
            test_scenario::return_to_sender(scenario, personal_medal);
        };
        test_scenario::next_tx(scenario, user);
        {
            let medal_store = test_scenario::take_shared<CollectionStore>(scenario);
            let medal = test_scenario::take_shared<CollectionSchema>(scenario);
            let personal_medal = test_scenario::take_from_sender<SoulboundTokenSchema>(scenario);
            assert!(personal_medal.medal == object::uid_to_inner(&medal.id), 0);
            test_scenario::return_shared(medal);
            test_scenario::return_shared(medal_store);
            test_scenario::return_to_sender(scenario, personal_medal);
        };
        test_scenario::end(scenario_val);
    }
}
