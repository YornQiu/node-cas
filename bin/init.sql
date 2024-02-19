create database if not exists node_cas default character set utf8mb4 collate utf8mb4_general_ci;

use node_cas;

create table t_application
(
    id          varchar(32)                         not null,
    name        varchar(32)                         not null,
    route       varchar(32)                         null,
    entry       varchar(255)                        null,
    description varchar(255)                        null,
    icon        varchar(32)                         null,
    create_at   timestamp default CURRENT_TIMESTAMP not null,
    update_at   timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint t_application_id_uindex
        unique (id),
    constraint t_application_name_uindex
        unique (name)
);

alter table t_application
    add primary key (id);

create table t_application_group
(
    id             int auto_increment
        primary key,
    application_id varchar(32) not null,
    group_id       varchar(32) not null
)
    comment 'group-application relation table';

create table t_group
(
    id          varchar(32)                         not null,
    name        varchar(32)                         not null,
    description varchar(255)                        null,
    create_at   timestamp default CURRENT_TIMESTAMP not null,
    update_at   timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint t_group_id_uindex
        unique (id),
    constraint t_group_name_uindex
        unique (name)
);

alter table t_group
    add primary key (id);

create table t_role
(
    id          varchar(32)                         not null,
    name        varchar(32)                         not null,
    description varchar(255)                        null,
    create_at   timestamp default CURRENT_TIMESTAMP not null,
    update_at   timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint t_role_id_uindex
        unique (id),
    constraint t_role_name_uindex
        unique (name)
);

alter table t_role
    add primary key (id);

create table t_user
(
    id        int auto_increment,
    username  char(32)                                                                     not null,
    nickname  char(32)                                                                     null,
    password  char(32)                                                                     not null,
    status    enum ('active', 'inactive', 'locked', 'cancelled') default 'inactive'        not null,
    email     varchar(32)                                                                  null,
    phone     varchar(32)                                                                  null,
    create_at timestamp                                          default CURRENT_TIMESTAMP not null,
    update_at timestamp                                          default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint t_user_id_uindex
        unique (id),
    constraint t_user_username_uindex
        unique (username)
);

alter table t_user
    add primary key (id);

alter table t_user auto_increment=10000000;

create table t_user_behavior
(
    id        int auto_increment,
    user_id   int                                 not null,
    behavior  text                                not null,
    type      char(32)                            null,
    ip        varchar(255)                        null,
    create_at timestamp default CURRENT_TIMESTAMP not null,
    constraint t_user_behavior_id_uindex
        unique (id)
);

create index t_user_behavior_t_user_id_fk
    on t_user_behavior (user_id);

alter table t_user_behavior
    add primary key (id);

create table t_user_group
(
    id       int auto_increment
        primary key,
    user_id  int         not null,
    group_id varchar(32) not null
)
    comment 'user-group relation table';

create table t_user_role
(
    id      int auto_increment
        primary key,
    user_id int         not null,
    role_id varchar(32) not null
)
    comment 'user-role relation table';

create definer = root@localhost view v_user as
select `node_cas`.`t_user`.`id`        AS `id`,
       `node_cas`.`t_user`.`username`  AS `username`,
       `node_cas`.`t_user`.`nickname`  AS `nickname`,
       `node_cas`.`t_user`.`status`    AS `status`,
       `node_cas`.`t_user`.`email`     AS `email`,
       `node_cas`.`t_user`.`phone`     AS `phone`,
       `node_cas`.`t_user`.`create_at` AS `create_at`,
       `node_cas`.`t_user`.`update_at` AS `update_at`
from `node_cas`.`t_user`;

insert into t_user (id, username, nickname, password, status, email, phone) values (10000000, 'admin', '系统管理员','d1449edcb8e2d3f94139c189a8a341af', 'active', '', '');
insert into t_user (id, username, nickname, password, status, email, phone) values (10000001, 'audit', '系统审计员','d1449edcb8e2d3f94139c189a8a341af', 'active', '', '');

insert into t_group (id, name, description) values ('admin', '管理用户组', '系统内置用户组，系统管理员');
insert into t_group (id, name, description) values ('audit', '审计用户组', '系统内置用户组，系统审计员');

insert into t_user_group (user_id, group_id) values (10000000, 'admin');
insert into t_user_group (user_id, group_id) values (10000001, 'audit');
