1.  This is the current state of the apps db

```
create table addresses
(
    id             serial
        primary key,
    street_address varchar(255) not null,
    city           varchar(100) not null,
    state          varchar(50)  not null,
    zip_code       varchar(20)  not null,
    country        varchar(100) default 'USA'::character varying
);

alter table addresses
    owner to postgres;

create table homes
(
    id            serial
        primary key,
    address_id    integer
        references addresses,
    square_feet   integer not null,
    bedrooms      integer not null,
    fullbath      integer not null,
    halfbath      integer not null,
    garage_spaces integer not null
);

alter table homes
    owner to postgres;
```

I want to add the concept of receipts.  

Each home will periodically require maintenance.  It might need a new door.  It might need an HVAC technician to repair the AC.  And those efforts will generate purchased goods or services.  We need to record those `receipts`.  Each home can have many receipts.

Here are the pertinant parts of a create record (besides createdAT, modifiedAt, createdBy, modifiedBy)

total,
type = service | store
store (or service) name,
paid date,
homeId

I need a sql script to create this table.  
I need a crud end point.
I want unit testing for that crud endpoint
I want swagger documentation for that endpoint.

If you can think of a better model for reciept, be my guest.  The only real constraint I insist on is the 1 to many relationship between homes and receipts.

Currently I am not using an ORM.  I am open to ORM.  But I am also open to current repository pattern already implemented.  Perhaps that needs to be optimized.  But Ultimately I am going to want the ability for this api to return nested resources like tenant => home => receipts.

I do not need a vendor table as of now.  For now vendor/store can be a string/char.  But I will need a vendor resource later.