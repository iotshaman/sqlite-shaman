import 'mocha';
import { expect } from 'chai';
import { SampleService } from './sample.service';
import { User } from './models/user';

describe('Sample', () => {

  let service: SampleService;

  before(async () => {
    service = new SampleService();
    await service.initialize();
    let user = new User();
		user.userId = 1;
		user.firstName = 'Kyle';
		user.lastName = 'Brown';
		user.emailAddress = 'kbrown@iotshaman.com';
    await service.addUser(user);
  });

  after(async () => {
    await service.deleteUser(1);
  });

  it('userExists', async () => {
    let shouldExist = await service.userExists(1);
    let shouldNotExist = await service.userExists(100);
    expect(shouldExist).to.equal(true);
    expect(shouldNotExist).to.equal(false);
  });

  it('getUser', async () => {
    let user = await service.getUser(1);
    expect(user.firstName).to.equal("Kyle");
  });

  it('getUsers', async () => {
    let user = await service.getUsers();
    expect(user.length).to.equal(1);
  });

  it('updateUser', async () => {
    let user = new User();
		user.userId = 2;
		user.firstName = 'John';
		user.lastName = 'Doe';
		user.emailAddress = 'John.Doe@test.com';
    await service.addUser(user);
    user.emailAddress = 'jdoe@test.com';
    await service.updateUser(user);
    var result = await service.getUser(2);
    expect(result.emailAddress).to.equal('jdoe@test.com');
    await service.deleteUser(2);
  });

  it('first / last', async () => {
    let user = new User();
		user.userId = 3;
		user.firstName = 'Jane';
		user.lastName = 'Doe';
		user.emailAddress = 'Jane.Doe@test.com';
    await service.addUser(user);
    var first = await service.getFirstUser();
    expect(first.userId).to.equal(1);
    var last = await service.getLastUser();
    expect(last.userId).to.equal(3);
    await service.deleteUser(3);
  });

})