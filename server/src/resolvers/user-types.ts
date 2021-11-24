import { MinLength, IsEmail, Length, Matches } from 'class-validator';
import { User } from '../entities/User';
import { InputType, Field, ObjectType } from 'type-graphql';

@InputType()
export class PasswordInput {
  @Field()
  @MinLength(8)
  password: string;
}

@InputType()
export class UsernamePasswordInput extends PasswordInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_.]*$/, {
    message:
      'Usernames may only contain letters, numbers, underscores ("_") and periods (".")',
  })
  username: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
export class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}
